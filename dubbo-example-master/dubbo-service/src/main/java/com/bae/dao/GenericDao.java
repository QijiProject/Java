/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.bae.dao;

/**
 *
 * @author Heng Wai
 */
public interface GenericDao<T> {
    T saveOrUpdate (T t);
}
